package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/SlyOtis/dndcs/internal/broker"
	"github.com/SlyOtis/dndcs/internal/db"
	"github.com/SlyOtis/dndcs/internal/handler"
	"github.com/SlyOtis/dndcs/internal/storage"
	"github.com/SlyOtis/dndcs/internal/version"
	"github.com/joho/godotenv"
	"github.com/labstack/echo/v4"
	em "github.com/labstack/echo/v4/middleware"
	"github.com/labstack/gommon/log"
	"github.com/nimling/nimtel"
	saecho "github.com/nimling/samna-auth-middleware/v2/disciple/echo"
	sam "github.com/nimling/samna-auth-middleware/v2/disciple/sam"
	sdb "github.com/nimling/samna-auth-middleware/v2/disciple/sdb"
	smw "github.com/nimling/samna-auth-middleware/v2/smw"
	"github.com/nimling/samna-auth-middleware/v2/uptime"
)

func main() {
	_ = godotenv.Overload(".env")

	if version.Version == "dev" && os.Getenv("SERVER_VERSION") != "" {
		version.Version = os.Getenv("SERVER_VERSION")
	}

	serverPort := os.Getenv("SERVER_PORT")
	if serverPort == "" {
		serverPort = "4290"
	}
	htmlPath := os.Getenv("SERVER_HTML_PATH")
	if htmlPath == "" {
		htmlPath = "./web/dist"
	}
	allowedOrigins := os.Getenv("SERVER_ALLOWED_ORIGINS")
	if allowedOrigins == "" {
		allowedOrigins = "http://localhost:5173,http://localhost:" + serverPort
	}

	e := echo.New()
	e.HideBanner = true
	e.HidePort = true

	switch strings.ToLower(os.Getenv("SERVER_LOG_LEVEL")) {
	case "debug":
		e.Logger.SetLevel(log.DEBUG)
	case "warn":
		e.Logger.SetLevel(log.WARN)
	case "error":
		e.Logger.SetLevel(log.ERROR)
	default:
		e.Logger.SetLevel(log.INFO)
	}

	shutdownTelemetry, err := nimtel.Init(context.Background(), nimtel.Config{
		ServiceName:    os.Getenv("SAUTH_APP_SLUG"),
		ServiceVersion: version.Version,
		Environment:    os.Getenv("SERVER_ENVIRONMENT"),
		Debug:          strings.EqualFold(os.Getenv("SERVER_LOG_LEVEL"), "debug"),
	})
	if err != nil {
		e.Logger.Fatalf("init telemetry: %v", err)
	}
	defer func() {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		if err := shutdownTelemetry(ctx); err != nil {
			slog.Error("telemetry shutdown", "error", err)
		}
	}()

	if err := db.Init(e.Logger); err != nil {
		e.Logger.Fatalf("init postgres: %v", err)
	}
	if _, err := sdb.Init(e.Logger); err != nil {
		e.Logger.Fatalf("samna auth db init: %v", err)
	}
	if err := broker.Init(context.Background(), db.Instance().DB); err != nil {
		e.Logger.Fatalf("init broker: %v", err)
	}
	if err := storage.Init(context.Background()); err != nil {
		e.Logger.Fatalf("init storage: %v", err)
	}

	e.Use(smw.TelemetryMiddleware())
	e.Use(em.Logger())
	e.Use(em.Recover())
	e.Use(em.RequestID())
	e.Use(em.CORSWithConfig(em.CORSConfig{
		AllowOrigins:     strings.Split(allowedOrigins, ","),
		AllowMethods:     []string{echo.GET, echo.PUT, echo.POST, echo.DELETE, echo.PATCH},
		AllowHeaders:     []string{"Authorization", "Content-Type", "Accept"},
		AllowCredentials: true,
	}))

	sam.RegisterStatus(e.Group(uptime.StatusBasePath))

	userAuth := smw.UserAuthMiddleware(nil)

	api := e.Group("/api")
	{
		status := api.Group("/status")
		status.GET("/health/liveness", handler.GetHealthLiveness)
		status.GET("/health/readiness", handler.GetHealthReadiness)
		status.GET("/version", handler.GetVersion)

		auth := api.Group("/auth")
		auth.GET("/login", saecho.GetLogin)
		auth.GET("/callback", saecho.GetCallback)
		auth.GET("/logout", saecho.GetLogout)
		sam.RegisterCli(auth)

		me := auth.Group("/me", userAuth)
		me.GET("", saecho.GetMe)
		me.PUT("", saecho.PutMe)
		me.PATCH("", saecho.PatchMe)
		me.GET("/claim", saecho.GetMeClaims)
		me.GET("/organization", saecho.GetMeOrganizations)

		profile := api.Group("/profile", userAuth)
		profile.GET("", handler.GetProfile)
		profile.POST("", handler.PostProfile)
		profile.PUT("", handler.PutProfile)
		profile.GET("/stream", handler.GetProfileStream)
		profile.GET("/list", handler.GetProfiles)
		profile.GET("/details", handler.GetProfileDetails)
		profile.PUT("/details", handler.PutProfileDetails)
		profile.POST("/friend", handler.PostProfileFriend)
		profile.DELETE("/friend/:user_id", handler.DeleteProfileFriend)
		profile.GET("/:user_id", handler.GetProfileUser)

		character := api.Group("/character", userAuth)
		character.GET("", handler.GetCharacters)
		character.POST("", handler.PostCharacter)
		character.GET("/:id", handler.GetCharacter)
		character.PUT("/:id", handler.PutCharacter)
		character.DELETE("/:id", handler.DeleteCharacter)
		character.PUT("/:id/played", handler.PutCharacterPlayed)
		character.GET("/:id/sources", handler.GetCharacterSources)
		character.PUT("/:id/sources", handler.PutCharacterSources)
		character.GET("/:id/stream", handler.GetCharacterStream)

		party := api.Group("/party", userAuth)
		party.GET("", handler.GetParties)
		party.POST("", handler.PostParty)
		party.GET("/:id", handler.GetParty)
		party.GET("/:id/stream", handler.GetPartyStream)
		party.PUT("/:id", handler.PutParty)
		party.DELETE("/:id", handler.DeleteParty)
		party.POST("/:id/character/:character_id", handler.PostPartyCharacter)
		party.DELETE("/:id/character/:character_id", handler.DeletePartyCharacter)

		campaign := api.Group("/campaign", userAuth)
		campaign.GET("", handler.GetCampaigns)
		campaign.POST("", handler.PostCampaign)
		campaign.GET("/:id", handler.GetCampaign)
		campaign.PUT("/:id", handler.PutCampaign)
		campaign.DELETE("/:id", handler.DeleteCampaign)
		campaign.POST("/:id/player", handler.PostCampaignPlayer)
		campaign.DELETE("/:id/player/:user_id", handler.DeleteCampaignPlayer)
		campaign.GET("/:id/character", handler.GetCampaignCharacters)
		campaign.POST("/:id/character/:character_id", handler.PostCampaignCharacter)
		campaign.DELETE("/:id/character/:character_id", handler.DeleteCampaignCharacter)
		campaign.GET("/:id/stream", handler.GetCampaignStream)
		campaign.GET("/:id/map", handler.GetMaps)
		campaign.POST("/:id/map", handler.PostMap)
		campaign.PUT("/:id/map/:map_id", handler.PutMap)
		campaign.DELETE("/:id/map/:map_id", handler.DeleteMap)
		campaign.GET("/:id/encounter", handler.GetEncounters)
		campaign.POST("/:id/encounter", handler.PostEncounter)
		campaign.PUT("/:id/encounter/:encounter_id", handler.PutEncounter)
		campaign.DELETE("/:id/encounter/:encounter_id", handler.DeleteEncounter)
		campaign.GET("/:id/song", handler.GetSongs)
		campaign.POST("/:id/song", handler.PostSong)
		campaign.PUT("/:id/song/:song_id", handler.PutSong)
		campaign.DELETE("/:id/song/:song_id", handler.DeleteSong)
		campaign.GET("/:id/chat", handler.GetChatEntries)
		campaign.POST("/:id/chat", handler.PostChatEntry)
		campaign.PUT("/:id/chat/:entry_id", handler.PutChatEntry)
		campaign.DELETE("/:id/chat/:entry_id", handler.DeleteChatEntry)

		resource := api.Group("/resource", userAuth)
		resource.GET("", handler.GetResources)
		resource.POST("", handler.PostResource)
		resource.GET("/:id", handler.GetResource)
		resource.PUT("/:id", handler.PutResource)
		resource.DELETE("/:id", handler.DeleteResource)
		resource.GET("/:id/stream", handler.GetResourceStream)
		resource.GET("/:id/update", handler.GetResourceUpdates)
		resource.POST("/:id/update", handler.PostResourceUpdate)
		resource.PUT("/:id/update", handler.PutResourceUpdates)
		resource.DELETE("/:id/update", handler.DeleteResourceUpdates)

		file := api.Group("/file", userAuth)
		file.GET("", handler.GetFile)
		file.POST("", handler.PostFile)
		file.DELETE("", handler.DeleteFile)
		file.GET("/data", handler.GetFileData)
		file.HEAD("/data", handler.GetFileData)
		file.PUT("/data", handler.PutFileData)

		ai := api.Group("/ai", userAuth)
		ai.Match([]string{http.MethodGet, http.MethodPost}, "/*", handler.PostAI)

		catalog := api.Group("/catalog", userAuth)
		catalog.GET("/:kind", handler.GetCatalogEntries)
		catalog.GET("/:kind/:slug", handler.GetCatalogEntry)
		catalog.PUT("/:kind/:slug", handler.PutCatalogEntry)

		claim := api.Group("/claim", userAuth)
		claim.POST("", handler.PostClaim)
		claim.GET("/:id", handler.GetClaim)
		claim.POST("/:id/user", handler.PostClaimUser)
		claim.DELETE("/:id/user/:user_id", handler.DeleteClaimUser)
		claim.POST("/:id/object", handler.PostClaimObject)
		claim.DELETE("/:id/object/:object_id", handler.DeleteClaimObject)
		api.GET("/:type/:id/claim", handler.GetObjectClaims, userAuth)
	}

	e.GET("/*", handler.GetHTML(htmlPath))

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	runCtx, cancelRun := context.WithCancel(context.Background())
	defer cancelRun()

	if err := sam.Init(runCtx); err != nil {
		e.Logger.Fatalf("sync init: %v", err)
	}

	server := &http.Server{Addr: ":" + serverPort, Handler: e, ReadHeaderTimeout: 30 * time.Second}
	e.Logger.Infof("dndcs %s on port %s", version.Version, serverPort)
	go func() {
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			slog.Error("server stopped", "error", err)
			stop()
		}
	}()
	<-ctx.Done()

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := server.Shutdown(shutdownCtx); err != nil {
		slog.Error("server shutdown", "error", err)
	}
	cancelRun()
	<-sam.Done()
	if err := broker.Instance().Close(); err != nil {
		slog.Error("close broker", "error", err)
	}
	if err := db.Instance().Close(); err != nil {
		slog.Error("close database", "error", err)
	}
	if err := sdb.Instance().Close(); err != nil {
		slog.Error("close samna auth database", "error", err)
	}
}
