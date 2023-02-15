import { Bot } from "mineflayer";

export function plugin(bot: Bot) {
    var originalFunction = bot._client.write;

    // Create a new function that wraps the original function
    var newFunction = function (this: unknown, name: string, params: any) {
        if (name === "entity_action") {
            if (params.actionId === 3 || params.actionId === 4) {
                // cancel sprint start and sprint stop packets
                return;
            }
        }
        if (name === 'position_look' || name === 'position') {
            params.onGround = false
        }
        return originalFunction.apply(this, [...arguments] as [name: string, params: any])
    }

    // Replace the original function with the new function
    bot._client.write = newFunction;
}