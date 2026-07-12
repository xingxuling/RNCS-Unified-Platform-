# TileMap 与导航 API v1.1

## TileMap

```js
createTileMap(options)
generateFrostTrialTileMap()
validateTileMap(tilemap)
setTile(tilemap, { layerId, x, y, tileId })
paintTiles(tilemap, { layerId, cells, tileId })
paintRect(tilemap, { layerId, x0, y0, x1, y1, tileId })
floodFill(tilemap, { layerId, x, y, tileId })
```

## 编译

```js
compileTileMapProjection(tilemap)
compileCollisionShapes(tilemap)
compileNavigationGrid(tilemap, options)
compileSceneNavigation(scene, options)
```

## 路径

```js
findPath(grid, startCell, endCell, { allowDiagonal })
smoothPath(grid, path)
pathWorldPoints(tilemap, path)
navigationReceipt(input)
```

## 统一制造会话

```js
session.editTile(command)
session.setTileTool(options)
session.queryPath(query)
session.setNavigationTarget(target)
session.clearNavigationTarget(nodeId)
session.stepNavigation()
```

## CLI

```bash
node src/cli.mjs navigation-path \
  --project examples/冰境试炼.unified-project.json \
  --start-x 88 --start-y 72 --end-x 568 --end-y 280 \
  --out output/navigation-path.json
```
