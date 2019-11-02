import Mailgun from "mailgun-js";

export class MailService {

    private readonly mailgun: Mailgun.Mailgun;
    private readonly fromEmail: string;

    constructor(mailgun: Mailgun.Mailgun, fromEmail: string) {
        this.mailgun = mailgun;
        this.fromEmail = fromEmail;
    }

    public readonly sendEmail = async (
        emailData: EmailData,
    ): Promise<Mailgun.messages.SendResponse> => {
        return this.mailgun.messages().send({
            ...emailData,
            from: this.fromEmail,
        });
    }
}

export type EmailData = {
    to: string;
    subject: string;
    text: string;
};

export function createMailService(
    mailgunApiKey: string,
    mailgunDomain: string,
    fromEmail: string,
): MailService {
    const mailgun = Mailgun({ apiKey: mailgunApiKey, domain: mailgunDomain });
    return new MailService(mailgun, fromEmail);
}
