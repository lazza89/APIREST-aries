import { Issuer } from "../Issuer";


let issuer: Issuer;
export const InitIssuer = async () => {
    issuer = await Issuer.build();
    await issuer.importDid();
}

export const invitationLink = async () => {
    try {
        if(!issuer) {await InitIssuer()}

        const invite = await issuer.printConnectionInvite();
        return invite
    } catch (err) {
        console.log('Error', err)
    }
}

export const acceptConn = async () => {
    try {
        if(!issuer) {throw new Error('Issuer not initialized')}
        await issuer.waitForConnection();
        return 'Connection established';
    } catch (err) {
        console.log('Error', err)
    }
}

export const credential = async () => {
    try {
        if(!issuer) {throw new Error('Issuer not initialized')}
        await issuer.issueCredential();
        return 'Credential issued';
    } catch (err) {
        console.log('Error', err)
    }
}

export const proof = async () => {
    try {
        if(!issuer) {throw new Error('Issuer not initialized')}
        await issuer.sendProofRequest();
        return 'Proof request sent';
    } catch (err) {
        console.log('Error', err)
    }
}