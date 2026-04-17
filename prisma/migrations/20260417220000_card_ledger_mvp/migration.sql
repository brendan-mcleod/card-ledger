PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_Collection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Collection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO "new_Collection" ("id", "name", "description", "createdAt", "userId")
SELECT "id", "name", NULL, CURRENT_TIMESTAMP, "userId"
FROM "Collection";

DROP TABLE "Collection";
ALTER TABLE "new_Collection" RENAME TO "Collection";

CREATE TABLE "new_Card" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "playerName" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "setName" TEXT NOT NULL,
    "cardTitle" TEXT NOT NULL,
    "team" TEXT NOT NULL,
    "notes" TEXT,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "collectionId" TEXT NOT NULL,
    CONSTRAINT "Card_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO "new_Card" (
    "id",
    "playerName",
    "year",
    "setName",
    "cardTitle",
    "team",
    "notes",
    "isFavorite",
    "createdAt",
    "collectionId"
)
SELECT
    "id",
    "name",
    "year",
    'Unknown Set',
    'Base',
    'Unknown Team',
    NULL,
    false,
    CURRENT_TIMESTAMP,
    "collectionId"
FROM "Card";

DROP TABLE "Card";
ALTER TABLE "new_Card" RENAME TO "Card";

CREATE INDEX "Card_collectionId_idx" ON "Card"("collectionId");
CREATE INDEX "Card_createdAt_idx" ON "Card"("createdAt");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
