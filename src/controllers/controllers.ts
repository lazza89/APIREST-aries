import { invitationLink } from '../models/models'

export const getInvitationLink = async (req: any, res: any) => {
    try {
        const resp = await invitationLink()
        res.status(200).json(resp)
    } catch (err) {
        res.status(500).send(err)
    }
}
