package test

import (
	"bufio"
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/SlyOtis/dndcs/internal/broker"
	"github.com/SlyOtis/dndcs/internal/db"
	"github.com/SlyOtis/dndcs/internal/handler"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

const wait = 3 * time.Second

func newBroker(t *testing.T) *broker.Broker {
	t.Helper()
	requireStack(t)
	b, err := broker.New(context.Background(), db.Instance().DB)
	if err != nil {
		t.Fatalf("broker: %v", err)
	}
	t.Cleanup(func() { _ = b.Close() })
	return b
}

func requireBroker(t *testing.T) {
	t.Helper()
	requireStack(t)
	if broker.Instance() != nil {
		return
	}
	if err := broker.Init(context.Background(), db.Instance().DB); err != nil {
		t.Fatalf("broker: %v", err)
	}
}

func receive(t *testing.T, events <-chan broker.Event) (broker.Event, bool) {
	t.Helper()
	select {
	case ev := <-events:
		return ev, true
	case <-time.After(wait):
		return broker.Event{}, false
	}
}

func TestAnEventReachesTheSameInstanceAtOnce(t *testing.T) {
	b := newBroker(t)
	topic := broker.CampaignTopic(uuid.New())
	events, release := b.Get(topic)
	defer release()

	b.Post(context.Background(), broker.Event{Topic: topic, Kind: broker.KindChat, ID: "one", Op: broker.OpCreate})

	ev, ok := receive(t, events)
	if !ok || ev.ID != "one" {
		t.Fatalf("the same instance did not get its own event")
	}
	select {
	case again := <-events:
		t.Fatalf("the instance read its own notify back: %+v", again)
	case <-time.After(time.Second):
	}
}

func TestAnEventReachesAnotherInstanceThroughNotify(t *testing.T) {
	sender, other := newBroker(t), newBroker(t)
	topic := broker.CampaignTopic(uuid.New())
	events, release := other.Get(topic)
	defer release()
	elsewhere, releaseElsewhere := other.Get(broker.CampaignTopic(uuid.New()))
	defer releaseElsewhere()

	sender.Post(context.Background(), broker.Event{Topic: topic, Kind: broker.KindMap, ID: "two", Op: broker.OpUpdate})

	ev, ok := receive(t, events)
	if !ok || ev.ID != "two" || ev.Kind != broker.KindMap {
		t.Fatalf("the other instance did not get the event")
	}
	select {
	case stray := <-elsewhere:
		t.Fatalf("an event reached another topic: %+v", stray)
	default:
	}
}

func openStream(t *testing.T, server *httptest.Server, actor uuid.UUID, path string) <-chan string {
	t.Helper()
	ctx, cancel := context.WithCancel(context.Background())
	t.Cleanup(cancel)
	req, _ := http.NewRequestWithContext(ctx, http.MethodGet, server.URL+path, nil)
	req.Header.Set("Accept", "text/event-stream")
	req.Header.Set("X-Actor", actor.String())
	res, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatalf("stream %s: %v", path, err)
	}
	if res.StatusCode != http.StatusOK {
		t.Fatalf("stream %s answered %d", path, res.StatusCode)
	}
	lines := make(chan string, 64)
	go func() {
		defer res.Body.Close()
		scanner := bufio.NewScanner(res.Body)
		for scanner.Scan() {
			if line := scanner.Text(); strings.HasPrefix(line, "data: ") {
				lines <- strings.TrimPrefix(line, "data: ")
			}
		}
	}()
	return lines
}

func streamServer(t *testing.T) *httptest.Server {
	t.Helper()
	e := echo.New()
	actor := func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			c.Set("user_id", uuid.MustParse(c.Request().Header.Get("X-Actor")))
			return next(c)
		}
	}
	e.GET("/api/campaign/:id/stream", handler.GetCampaignStream, actor)
	server := httptest.NewServer(e)
	t.Cleanup(server.Close)
	return server
}

func next(lines <-chan string, within time.Duration) (string, bool) {
	select {
	case line := <-lines:
		return line, true
	case <-time.After(within):
		return "", false
	}
}

func TestTheChatStreamCarriesAHiddenRollToTheDungeonMasterAlone(t *testing.T) {
	requireBroker(t)
	campaignID := postCampaign(t)
	seatPlayer(t, campaignID)
	params := map[string]string{"id": campaignID}
	server := streamServer(t)
	dm := openStream(t, server, dungeonMaster, "/api/campaign/"+campaignID+"/stream")
	pip := openStream(t, server, player, "/api/campaign/"+campaignID+"/stream")

	_, hidden := call(t, dungeonMaster, http.MethodPost, "/api/campaign/"+campaignID+"/chat", `{"author_name":"DM","kind":"roll","is_hidden":true,"formula":"1d20","dice":[3],"roll":3,"total":3}`, params, handler.PostChatEntry)
	hiddenID := id(t, hidden)
	if line, ok := next(dm, wait); !ok || !strings.Contains(line, hiddenID) {
		t.Fatalf("the dungeon master did not hear the hidden roll: %q", line)
	}
	if line, ok := next(pip, time.Second); ok {
		t.Fatalf("the player heard a hidden roll: %q", line)
	}

	_, open := call(t, player, http.MethodPost, "/api/campaign/"+campaignID+"/chat", `{"author_name":"Pip","kind":"message","body":"hello"}`, params, handler.PostChatEntry)
	openID := id(t, open)
	if line, ok := next(pip, wait); !ok || !strings.Contains(line, openID) || !strings.Contains(line, `"kind":"chat"`) {
		t.Fatalf("the player did not hear the open message: %q", line)
	}
	if line, ok := next(dm, wait); !ok || !strings.Contains(line, openID) {
		t.Fatalf("the dungeon master did not hear the open message: %q", line)
	}
}

func TestACampaignStreamIsRefusedAwayFromTheTable(t *testing.T) {
	requireBroker(t)
	campaignID := postCampaign(t)
	server := streamServer(t)
	req, _ := http.NewRequest(http.MethodGet, server.URL+"/api/campaign/"+campaignID+"/stream", nil)
	req.Header.Set("Accept", "text/event-stream")
	req.Header.Set("X-Actor", player.String())
	res, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatalf("stream: %v", err)
	}
	defer res.Body.Close()
	if res.StatusCode == http.StatusOK {
		t.Fatalf("a player away from the table opened the campaign stream")
	}
}
