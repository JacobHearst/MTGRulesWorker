import { getRulesObject } from "./RulesParser"

export default {
    async fetch(request: Request): Promise<Response> {
        if (request.url.includes("/v1/mtg/rules")) {
            const rules = await getRulesObject()
            return new Response(JSON.stringify(rules), { headers: { "Content-Type": "application/json" } })
        }
        
        return new Response("Invalid url", { status: 404 })
    }
}
