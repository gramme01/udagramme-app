import { CreateGroupRequest } from "../requests/CreateGroupRequest";
import { Group } from '../models/Group';
import { GroupAccess } from "src/dataLayer/groupsAccess";
import { getUserId } from "src/auth/utils";
import { v4 as uuidv4 } from 'uuid';

const groupAccess = new GroupAccess();

export async function getAllGroups(): Promise<Group[]> {
    return groupAccess.getAllGroups();
}

export async function createGroup(
    createGroupRequest: CreateGroupRequest,
    jwtToken: string
): Promise<Group> {

    const itemId = uuidv4();
    const userId = getUserId(jwtToken);

    return await groupAccess.createGroup({
        id: itemId,
        userId: userId,
        name: createGroupRequest.name,
        description: createGroupRequest.description,
        // timestamp: new Date().toISOString(),
    });
}