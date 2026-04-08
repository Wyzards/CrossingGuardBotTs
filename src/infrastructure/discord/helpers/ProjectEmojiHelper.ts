import { DefaultReactionEmoji } from "discord.js";

export class ProjectEmojiHelper {
    static parse(emojiIdOrUnicode: string): DefaultReactionEmoji | undefined {
        if (emojiIdOrUnicode == null || emojiIdOrUnicode.toUpperCase() === "NULL")
            return undefined;
        if (isNaN(+emojiIdOrUnicode)) // Unicode
            return { id: null, name: emojiIdOrUnicode };
        else
            return { id: emojiIdOrUnicode, name: null };
    }

    static toString(emoji: DefaultReactionEmoji | undefined): string {
        if (!emoji)
            return "NULL";

        if (emoji.id)
            return emoji.id;
        else if (emoji.name)
            return emoji.name;

        return "NULL";
    }
}