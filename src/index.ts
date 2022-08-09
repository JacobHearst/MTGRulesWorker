import { getRulesObject } from "./RulesParser"

export default {
    async fetch(request: Request): Promise<Response> {
        if (request.url.includes("/v1/rules")) {
            const rules = await getRulesObject()
            if (rules) {
                return new Response(JSON.stringify(rules), { headers: { "Content-Type": "application/json" } })
            }

            return new Response("Couldn't get effective date", { status: 500 })
        }
        
        return new Response("Invalid url", { status: 404 })
    }
}
