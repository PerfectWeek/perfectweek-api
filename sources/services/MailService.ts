import Mailgun from "mailgun-js";

export class MailService {

    private readonly mailgun: Mailgun.Mailgun;

    constructor(mailgun: Mailgun.Mailgun) {
        this.mailgun = mailgun;
    }

    public readonly sendEmail = async (
        emailData: EmailData,
    ): Promise<Mailgun.messages.SendResponse> => {
        return this.mailgun.messages().send(emailData);
    }
}

export type EmailData = {
    from: string;
    to: string;
    subject: string;
    text: string;
};

export function createMailService(
    mailgunApiKey: string,
    mailgunDomain: string,
): MailService {
    const mailgun = Mailgun({ apiKey: mailgunApiKey, domain: mailgunDomain });
    return new MailService(mailgun);
}
