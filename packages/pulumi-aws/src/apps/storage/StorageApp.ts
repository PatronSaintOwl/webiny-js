import {
    defineApp,
    createGenericApplication,
    ApplicationHooks,
    ApplicationConfig
} from "@webiny/pulumi-sdk";
import { AppInput, getAppInput } from "../utils";

import { createCognitoResources } from "./StorageCognito";
import { createDynamoTable } from "./StorageDynamo";
import { ElasticSearch } from "./StorageElasticSearch";
import { createFileManagerBucket } from "./StorageFileManager";

export interface StorageAppConfig extends Partial<ApplicationHooks> {
    protect?: AppInput<boolean>;
    legacy?: AppInput<StorageAppLegacyConfig>;
    elasticSearch?: AppInput<boolean>;
}

export interface StorageAppLegacyConfig {
    useEmailAsUsername?: boolean;
}

export const StorageApp = defineApp({
    name: "storage",
    config(app, config: StorageAppConfig) {
        const protect = getAppInput(app, config.protect) ?? app.ctx.env !== "dev";
        const legacyConfig = getAppInput(app, config.legacy) ?? {};

        // Setup DynamoDB table
        const dynamoDbTable = createDynamoTable(app, { protect });

        // Setup Cognito
        const cognito = createCognitoResources(app, {
            protect,
            useEmailAsUsername: legacyConfig.useEmailAsUsername ?? false
        });

        // Setup file storage bucket
        const fileManagerBucket = createFileManagerBucket(app, { protect });

        const elasticSearch = getAppInput(app, config.elasticSearch)
            ? app.addModule(ElasticSearch, { protect: protect })
            : null;

        app.addOutputs({
            fileManagerBucketId: fileManagerBucket.output.id,
            primaryDynamodbTableArn: dynamoDbTable.output.arn,
            primaryDynamodbTableName: dynamoDbTable.output.name,
            primaryDynamodbTableHashKey: dynamoDbTable.output.hashKey,
            primaryDynamodbTableRangeKey: dynamoDbTable.output.rangeKey,
            cognitoUserPoolId: cognito.userPool.output.id,
            cognitoUserPoolArn: cognito.userPool.output.arn,
            cognitoUserPoolPasswordPolicy: cognito.userPool.output.passwordPolicy,
            cognitoAppClientId: cognito.userPoolClient.output.id
        });

        return {
            dynamoDbTable,
            ...cognito,
            fileManagerBucket,
            elasticSearch
        };
    }
});

export type StorageApp = InstanceType<typeof StorageApp>;

export function createStorageApp(config: StorageAppConfig & ApplicationConfig<StorageApp>) {
    return createGenericApplication({
        id: "storage",
        name: "storage",
        description: "Your project's persistent storages.",
        async app(ctx) {
            const app = new StorageApp(ctx);
            await app.setup(config);
            await config.config?.(app, ctx);
            config.config?.(app, ctx);
            return app;
        },
        onBeforeBuild: config.onBeforeBuild,
        onAfterBuild: config.onAfterBuild,
        onBeforeDeploy: config.onBeforeDeploy,
        onAfterDeploy: config.onAfterDeploy
    });
}