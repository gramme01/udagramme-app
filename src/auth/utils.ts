import { JwtToken } from "./JwtToken";
import { decode } from "jsonwebtoken";

/**
 * Parse a JWT token and return a user id
 * @param jwtToken JWT token to parse
 * @returns a user id from the JWT token
 */
export function getUserId(jwtToken: string): string {
    const decodedJwt = decode(jwtToken) as JwtToken;
    return decodedJwt.sub;
}
