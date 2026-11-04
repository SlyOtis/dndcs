package broker

import (
	"context"
	"encoding/json"
	"log/slog"
	"sync"

	"github.com/google/uuid"
	"github.com/uptrace/bun"
	"github.com/uptrace/bun/driver/pgdriver"
)

const (
	Channel   = "dndcs_event"
	queueSize = 64
)

const (
	KindChat      = "chat"
	KindMap       = "map"
	KindEncounter = "encounter"
	KindSong      = "song"
	KindProfile   = "profile"
	KindUpdate    = "update"
)

const (
	OpCreate = "create"
	OpUpdate = "update"
	OpDelete = "delete"
)

type Event struct {
	Topic  string `json:"topic"`
	Kind   string `json:"kind"`
	ID     string `json:"id"`
	Op     string `json:"op"`
	Origin string `json:"origin"`
}

func CampaignTopic(id uuid.UUID) string {
	return "campaign:" + id.String()
}

func ProfileTopic(userID uuid.UUID) string {
	return "profile:" + userID.String()
}

func ResourceTopic(id uuid.UUID) string {
	return "resource:" + id.String()
}

type Broker struct {
	db       *bun.DB
	origin   string
	listener *pgdriver.Listener
	mu       sync.Mutex
	watches  map[string]map[chan Event]struct{}
	done     chan struct{}
}

var instance *Broker

func New(ctx context.Context, db *bun.DB) (*Broker, error) {
	listener := pgdriver.NewListener(db)
	if err := listener.Listen(ctx, Channel); err != nil {
		_ = listener.Close()
		return nil, err
	}
	b := &Broker{db: db, origin: uuid.NewString(), listener: listener, watches: map[string]map[chan Event]struct{}{}, done: make(chan struct{})}
	go b.receive(listener.Channel())
	return b, nil
}

func Init(ctx context.Context, db *bun.DB) error {
	b, err := New(ctx, db)
	if err != nil {
		return err
	}
	instance = b
	return nil
}

func Instance() *Broker {
	return instance
}

func Post(ctx context.Context, topic, kind, id, op string) {
	if instance == nil {
		return
	}
	instance.Post(ctx, Event{Topic: topic, Kind: kind, ID: id, Op: op})
}

func (b *Broker) Post(ctx context.Context, ev Event) {
	ev.Origin = b.origin
	b.put(ev)
	raw, err := json.Marshal(ev)
	if err != nil {
		return
	}
	if err := pgdriver.Notify(ctx, b.db, Channel, string(raw)); err != nil {
		slog.ErrorContext(ctx, "broker notify", "error", err)
	}
}

func (b *Broker) Get(topic string) (<-chan Event, func()) {
	watch := make(chan Event, queueSize)
	b.mu.Lock()
	if b.watches[topic] == nil {
		b.watches[topic] = map[chan Event]struct{}{}
	}
	b.watches[topic][watch] = struct{}{}
	b.mu.Unlock()
	return watch, func() {
		b.mu.Lock()
		delete(b.watches[topic], watch)
		if len(b.watches[topic]) == 0 {
			delete(b.watches, topic)
		}
		b.mu.Unlock()
	}
}

func (b *Broker) Close() error {
	err := b.listener.Close()
	<-b.done
	return err
}

func (b *Broker) receive(notifications <-chan pgdriver.Notification) {
	defer close(b.done)
	for n := range notifications {
		var ev Event
		if err := json.Unmarshal([]byte(n.Payload), &ev); err != nil {
			continue
		}
		if ev.Origin == b.origin {
			continue
		}
		b.put(ev)
	}
}

func (b *Broker) put(ev Event) {
	b.mu.Lock()
	defer b.mu.Unlock()
	for watch := range b.watches[ev.Topic] {
		select {
		case watch <- ev:
		default:
		}
	}
}
