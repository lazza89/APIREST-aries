import { invitationLink, acceptConn } from '../models/models'

export const getInvitationLink = async (req: any, res: any) => {
    try {
        const resp = await invitationLink()
        res.status(200).json(resp)
        await acceptConn()
    } catch (err) {
        res.status(500).send(err)
    }
}
