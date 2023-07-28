import { invitationLink, acceptConn, credential, proof } from '../models/models'

export const getInvitationLink = async (req: any, res: any) => {
    try {
        const resp = await invitationLink()
        res.status(200).json(resp)
        await acceptConn()
    } catch (err) {
        res.status(500).send(err)
    }
}

export const getCredential = async (req: any, res: any) => {
    try {
        const resp = await credential()
        res.status(200).json(resp)
    } catch (err) {
        res.status(500).send(err)
    }
}

export const getProof = async (req: any, res: any) => {
    try {
        const resp = await proof()
        res.status(200).json(resp)
    } catch (err) {
        res.status(500).send(err)
    }
}
