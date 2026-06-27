-- 增量迁移：新增 item_icon_groups(user_id, sort, id) 复合索引，移除冗余/死索引
--
-- 背景：
-- - getGroupList / getAllData 的热点查询 WHERE user_id = ? ORDER BY sort ASC, id ASC 之前无对应复合索引，触发 filesort。
-- - idx_item_icons_group_id 单列索引被 idx_item_icons_group_user 复合索引左前缀覆盖，冗余。
-- - idx_users_token 死索引（全仓无 WHERE token = ? 查询，users.token 列仅作为 JWT 概念存在，非数据库查询字段）。
--
-- 执行方式：
--   本地：wrangler d1 execute sun-panel-db --file=./migrations/2026-06-27-add-group-sort-index.sql --local
--   远程：wrangler d1 execute sun-panel-db --file=./migrations/2026-06-27-add-group-sort-index.sql --remote

-- 新增复合索引：按用户排序分组（覆盖 WHERE user_id ORDER BY sort, id 热点查询）
CREATE INDEX IF NOT EXISTS idx_item_icon_groups_user_sort ON item_icon_groups(user_id, sort, id);

-- 移除冗余索引：被 idx_item_icons_group_user 复合索引左前缀覆盖
DROP INDEX IF EXISTS idx_item_icons_group_id;

-- 移除死索引：全仓无 WHERE token = ? 查询
DROP INDEX IF EXISTS idx_users_token;
