import { ContextPlugin } from "@webiny/handler";
import { WcpContext } from "~/types";
import { createWcp } from "~/createWcp";

export default () => {
    return new ContextPlugin<WcpContext>(async context => {
        context.wcp = await createWcp();
    });
};