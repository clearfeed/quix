-- CreateTable
CREATE TABLE "slack_workspaces" (
    "team_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bot_access_token" TEXT NOT NULL,
    "authed_user_id" TEXT NOT NULL,
    "bot_user_id" TEXT NOT NULL,
    "is_enterprise_install" BOOLEAN NOT NULL,
    "scopes" TEXT[],
    "app_id" TEXT NOT NULL,

    CONSTRAINT "slack_workspaces_pkey" PRIMARY KEY ("team_id")
);
