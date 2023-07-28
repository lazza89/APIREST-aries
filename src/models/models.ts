import { Issuer } from "../Issuer";

export const invitationLink = async () => {
    try {
        const issuer = new Issuer(8080, "Faber college");
        await issuer.initialize();
        const invite = await issuer.printInvite();
        return invite
    } catch (err) {
        console.log('Error', err)
    }
}
