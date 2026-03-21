# Tiny Towns — Архитектура

## Стек

- **Reatom** — реактивное управление состоянием (atom, action, computed)
- **@reatom/jsx** — JSX-рендер без Virtual DOM (классический `h`/`hf` прагма)
- **Trystero/Nostr** — P2P мультиплеер (WebRTC через Nostr-релеи)
- **Vite + OXC** — сборка и транспиляция
- **TypeScript** — строгая типизация

## Структура файлов

```
src/
├── index.tsx              # Точка входа, mount(<App />)
├── app.tsx                # Корневой компонент: Lobby → Game → Finished
├── style.css              # Все стили (CSS custom properties, BEM-подобные классы)
├── model/
│   ├── types.ts           # Типы: Resource, BuildingType, CellContent, GamePhase, TurnPhase
│   ├── buildings.ts       # 6 зданий, паттерны, скоринг
│   ├── patterns.ts        # Поиск паттернов на сетке (вращения/отражения)
│   ├── player.ts          # reatomPlayer — состояние одного игрока (сетка, постройки)
│   ├── game.ts            # reatomGame — глобальный синглтон игры
│   ├── lobby.ts           # Создание/подключение к комнате, список игроков
│   └── multiplayer/
│       ├── transport.ts   # Trystero: joinRoom, send/broadcast/onMessage
│       ├── protocol.ts    # Типы сообщений HostMessage / ClientMessage
│       ├── actions.ts     # Унифицированные экшены (announceResource, markDone, и т.д.)
│       ├── host.ts        # Хост: обработка сообщений клиентов, startMultiplayerGame
│       └── client.ts      # Клиент: обработка сообщений от хоста
└── ui/
    ├── grid.tsx           # 4×4 сетка ячеек
    ├── cell.tsx           # Одна ячейка (ресурс / здание / пусто)
    ├── build-panel.tsx    # Горизонтальный список рецептов зданий
    ├── build-drawer.tsx   # Выбор варианта постройки (bottom sheet)
    ├── drawer.tsx         # Переиспользуемый bottom sheet (свайп для закрытия)
    ├── lobby.tsx          # UI лобби (создать/присоединиться/комната)
    ├── multiplayer-hud.tsx # HUD: ход, ресурс, кнопка «Готово»
    ├── opponents.tsx      # Мини-доски противников
    └── resource-swatch.tsx # Переиспользуемый компонент — цветной квадрат ресурса
```

## Ресурсы и здания

### 5 ресурсов (бесконечные)

| Ресурс  | Эмодзи | Цвет CSS-переменной |
| ------- | ------ | ------------------- |
| Дерево  | 🪵     | `--resource-wood`   |
| Камень  | 🪨     | `--resource-stone`  |
| Пшеница | 🌾     | `--resource-wheat`  |
| Кирпич  | 🧱     | `--resource-brick`  |
| Стекло  | 🔮     | `--resource-glass`  |

### 6 зданий

| Здание  | Эмодзи | Паттерн               | Скоринг                             |
| ------- | ------ | --------------------- | ----------------------------------- |
| Коттедж | 🏡     | wheat, brick, glass   | 3 VP если снабжён фермой            |
| Ферма   | 🌻     | 2×wheat, 2×wood       | 0 VP, кормит до 4 коттеджей         |
| Колодец | ⛲     | wood, stone           | 1 VP за каждый смежный коттедж      |
| Часовня | ⛪     | glass, 2×stone, glass | 1 VP за каждый накормленный коттедж |
| Таверна | 🍺     | 2×brick, glass        | Групповой скоринг: 2/5/9/14/20      |
| Пекарня | 🍞     | wheat, 2×brick, glass | 3 VP если рядом есть ферма          |

### CellContent

```typescript
type CellContent =
  | null // Пусто
  | { type: "resource"; resource: Resource } // Ресурс на клетке
  | { type: "building"; building: BuildingType }; // Построенное здание
```

## Модель данных

### game (синглтон)

| Атом                 | Тип                       | Описание                               |
| -------------------- | ------------------------- | -------------------------------------- |
| `phase`              | `GamePhase`               | `"lobby"` → `"playing"` → `"finished"` |
| `turnPhase`          | `TurnPhase`               | `"announce"` → `"place"`               |
| `players`            | `PlayerState[]`           | Все игроки                             |
| `currentResource`    | `Resource \| null`        | Текущий объявленный ресурс             |
| `turnNumber`         | `number`                  | Номер хода                             |
| `masterBuilderIndex` | `number`                  | Индекс текущего главного строителя     |
| `playerReadiness`    | `Record<string, boolean>` | Готовность игроков                     |
| `eliminatedPlayers`  | `Set<string>`             | Выбывшие игроки                        |

### player (per-instance)

| Атом                | Тип                  | Описание                       |
| ------------------- | -------------------- | ------------------------------ |
| `cells`             | `CellAtom[16]`       | 4×4 сетка                      |
| `selectedBuilding`  | `BuildingType\|null` | Выбранное здание для постройки |
| `highlightedCells`  | `Set<number>`        | Подсвеченные клетки            |
| `pendingBuilds`     | `BuildMatch[]`       | Варианты постройки             |
| `pendingTargetCell` | `number\|null`       | Целевая клетка постройки       |
| `drawerOpen`        | `boolean`            | Открыт ли drawer               |
| `hasPlacedResource` | `boolean`            | Поставил ли ресурс в этом ходу |

## Мультиплеер

### Роли

- **Host** — создаёт комнату, хранит авторитетное состояние, валидирует и ретранслирует действия
- **Client** — подключается к комнате, получает обновления от хоста
- **Master Builder (MB)** — ротируется каждый ход, выбирает ресурс для раунда

### Поток хода

```
1. MB выбирает ресурс → announceResource()
   - Host: game.announceResource(r) + broadcast(resource-announced)
   - Client: game.announceResource(r) + sendToHost(announce-resource)
     → Host получает, валидирует, broadcast(resource-announced)

2. Все игроки ставят ресурс на свою сетку → sendPlaceResource()
   - Host: player.placeResource() + broadcast(player-action)
   - Client: player.placeResource() + sendToHost(place-resource)
     → Host получает, применяет, broadcast(player-action)

3. Игроки могут строить здания → sendBuildAtCell()
   - Аналогично sendPlaceResource

4. Игрок нажимает «Готово» → markDone()
   - Host: game.markPlayerDone() + scheduleAdvanceCheck()
   - Client: game.markPlayerDone() + sendToHost(turn-done)
     → Host получает, markPlayerDone(), scheduleAdvanceCheck()

5. Когда все готовы → advanceIfAllDone()
   - game.endTurn() → ротация MB
   - broadcast(all-done { masterBuilderIndex, turnNumber })
   - Клиенты: game.applyTurnEnd(newMBIndex)

6. Элиминация → eliminateSelf()
   - Игрок без свободных клеток (или добровольно)
   - Host: broadcast(player-eliminated) + game.eliminatePlayer()
   - Client: sendToHost(player-eliminated-self)

7. Конец игры
   - Когда activePlayers.length === 0
   - Host: game.finishGame() + broadcast(game-over { scores })
```

### Протокол сообщений

**Host → All (broadcast):**

| Тип                  | Данные                                              |
| -------------------- | --------------------------------------------------- |
| `game-start`         | `players: { id, name }[]`                           |
| `resource-announced` | `resource, masterBuilderId, turnNumber`             |
| `player-action`      | `playerId, action: place-resource \| build-at-cell` |
| `player-eliminated`  | `playerId`                                          |
| `all-done`           | `turnNumber, masterBuilderIndex`                    |
| `game-over`          | `scores: { playerId, score, grid }[]`               |
| `lobby-state`        | `players: LobbyPlayer[], hostId`                    |
| `kick-player`        | `peerId`                                            |

**Client → Host:**

| Тип                      | Данные               |
| ------------------------ | -------------------- |
| `place-resource`         | `index, resource`    |
| `build-at-cell`          | `match, targetIndex` |
| `turn-done`              | —                    |
| `player-eliminated-self` | —                    |
| `announce-resource`      | `resource`           |
| `player-info`            | `name` (в лобби)     |

### Унифицированный слой действий (actions.ts)

`actions.ts` объединяет логику хоста и клиента в единые экшены. Каждый экшен:

1. Применяет действие локально (game/player)
2. Если хост — broadcast всем
3. Если клиент — sendToHost

Это устраняет дублирование между `hostAnnounceResource`/`clientAnnounceResource` и т.п.

## UI-компоненты

### App (app.tsx)

Роутинг по `game.phase`: `lobby` → `Lobby`, `playing` → `GameView`, `finished` → `GameFinished`.

### GameView

`ScoreDisplay` + `MultiplayerHud` + `Opponents` + `Grid` + `BuildPanel` + `Drawer(BuildDrawer)`.

### Lobby (lobby.tsx)

Трёхэкранная навигация: MenuView (имя + создать/присоединиться) → JoinView (ввод кода) → RoomView (список игроков, старт).

### ResourceSwatch (resource-swatch.tsx)

Переиспользуемый компонент — цветной квадрат ресурса. Принимает `resource` и опциональный `small`.
Заменяет повторяющийся паттерн `<span class="resource-swatch" style="background:...">`.
