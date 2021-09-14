const Eris = require("eris");
const assert = require("assert");
const fetch = require("node-fetch")
const { attachmentToDiscordFileObject } = require("../src/data/attachments")
const utils = require("../src/utils");

function getErrorResult(msg = null) {
    return {
        url: `Attachment could not be saved${msg ? ": " + msg : ""}`,
        failed: true
    };
}

async function createDiscordAttachmentMessage(channel, file, tries = 0) {
    tries++;

    try {
        const attachmentMessage = await channel.createMessage(undefined, file);
        return attachmentMessage.attachments[0];
    } catch (e) {
        if (tries > 3) {
            console.error(`Attachment storage message could not be created after 3 tries: ${e.message}`);
            return;
        }

        return createDiscordAttachmentMessage(channel, file, tries);
    }
}

module.exports = function ({ attachments, config }) {
    const saveDiscordAttachment = async (attachment) => {
        const attachmentChannelId = config.attachmentStorageChannelId;
        const inboxGuild = utils.getInboxGuild();

        assert(inboxGuild.channels.has(attachmentChannelId), "Attachment storage channel not found!")

        const attachmentChannel = inboxGuild.channels.get(attachmentChannelId);
        assert(attachmentChannel instanceof Eris.TextChannel, "Attachment storage channel must be a text channel!")

        const file = await attachmentToDiscordFileObject(attachment);
        const savedAttachment = await createDiscordAttachmentMessage(attachmentChannel, file);
        // eslint-disable-next-line space-unary-ops
        if (!savedAttachment) return getErrorResult();

        return { url: savedAttachment.url };
    };

    const saveS3Attachment = async (attachment) => {
        const { url } = await fetch(process.env.S3_UPLOADER_FUNCTION, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": process.env.S3_UPLOADER_AUTH
            },
            body: JSON.stringify({ url: attachment.url })
        }).then(res => res.json());
        return { url }
    }

    attachments.addStorageType("discord-fallback-s3", attachment => {
        if (attachment.size > 1024 * 1024 * 8) {
            return saveS3Attachment(attachment);
        } else {
            return saveDiscordAttachment(attachment);
        }
    });
};