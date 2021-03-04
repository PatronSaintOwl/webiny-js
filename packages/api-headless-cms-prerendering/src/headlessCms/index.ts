import { CmsContentEntryHookPlugin } from "@webiny/api-headless-cms/types";

export default () => {
    const plugin: CmsContentEntryHookPlugin = {
        type: "cms-content-entry-hook",
        async afterPublish(args) {
            if (args.entry.modelId === "location") {
                // @ts-ignore
                await args.context.pageBuilder.prerenderingClient.render({
                    paths: [{ path: args.entry.values.slug }] // /my-location-a
                });
            }
        }
    };

    return plugin;
};