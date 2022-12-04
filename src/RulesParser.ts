import { Category, GlossaryTerm, Rule, RulesObject, Subcategory, Subrule } from "./models"

/**
 * Get an object containing the rules and the glossary
 * @returns {Promise<RulesObject>}
 */
 export async function getRulesObject(): Promise<RulesObject | undefined> {
    const rulesText = await getRulesText()
    if (!rulesText) {
        console.error("Couldn't get rules text")
        return undefined
    }

    const rules = await getRules(rulesText)
    const glossary = await getGlossary(rulesText)
    const effectiveDate = getEffectiveDate(rulesText)

    if (effectiveDate) {
        return { rules, glossary, effectiveDate }
    }
}

/**
 * Get the latest comprehensive rules
 * @returns {Promise<Category[]>}
 */
export async function getRules(rulesText: string): Promise<Category[]> {
    const lines = rulesText.split("\r")
    let startingLine = lines.findIndex(line => line === "Credits") + 2
    lines.splice(0, startingLine)

    return parseRules(lines)
}

/**
 * Get the latest glossary terms for the comprehensive rules
 * @returns {Promise<GlossaryTerm[]>}
 */
export async function getGlossary(rulesText: string): Promise<GlossaryTerm[]> {
    const lines = rulesText.split("\r")
    const glossaryInTableOfContents = lines.indexOf("\nGlossary")
    const startingLine = lines.indexOf("\nGlossary", glossaryInTableOfContents) + 1
    lines.splice(0, startingLine)

    const endingLine = lines.indexOf("\nCredits")
    lines.splice(endingLine, lines.length - endingLine)

    return parseGlossary(lines)
}

/**
 * Get the latest comprehensive rules text from WOTC
 * @returns {Promise<string>}
 */
async function getRulesText(): Promise<string | undefined> {
    const rulesPageResponse = await fetch("https://magic.wizards.com/en/rules")
    if (!rulesPageResponse.ok) {
        throw new Error(`Recieved bad response from rules page: ${rulesPageResponse.statusText}`)
    }

    const regex = new RegExp('href="(.+/downloads/.+\.txt)" target=')
    const page = await rulesPageResponse.text()
    const matches = page.match(regex)

    if (matches) {
        const response = await fetch(matches[1])
        return (await response.text()).replaceAll("\u0000", "")
    } else {
        console.error("Couldn't find rules text link")
    }
}

/** 
 * Parses an array of strings that contains the mtg rules
 * @param {string[]} lines The raw lines of the rules text
 * @returns {Category[]}
 */
function parseRules(lines: string[]): Category[] {
    let rulesArr: Array<Category> = []
    let lastCategoryIndex = 0
    let lastSubcategoryIndex = 0
    let lastRuleIndex = 0
    lines.forEach((line) => {
        if (line === "") { return }
        let trimmed = line.trim()

        let categoryMatch = trimmed.match(/^(\d)\.((?: (?:[A-Z][a-z,]+|of|a|and))+)$/)
        let subcategoryMatch = trimmed.match(/^(\d\d+)\.((?: (?:[A-Z][a-z]+|of|a))+)$/)
        let ruleMatch = trimmed.match(/^(\d\d+\.\d)\. (.+)$/)
        let subruleMatch = trimmed.match(/^(\d\d+\.\d[a-z]) (.+)$/)
        if (categoryMatch) {
            // This line contains a category
            const id = categoryMatch[1]
            const title = categoryMatch[2].trim()
            const subcategories: Array<Subcategory> = []
            const category: Category = { id, title, subcategories }

            const categoryExists = rulesArr.some(cat => cat.id === id)

            if (!categoryExists) {
                rulesArr.push(category)
            }

            lastCategoryIndex = rulesArr.map(({ id }) => id).indexOf(id)
        }
        else if (subcategoryMatch) {
            // This line contains a subcategory
            const id = subcategoryMatch[1]
            const title = subcategoryMatch[2].trim()
            const rules: Array<Rule> = []
            const subcategory = { id, title, rules }

            const subcategoryExists = rulesArr[lastCategoryIndex].subcategories.some(subcat => subcat.id === id)
            if (!subcategoryExists) {
                rulesArr[lastCategoryIndex].subcategories.push(subcategory)
            }

            lastSubcategoryIndex = rulesArr[lastCategoryIndex].subcategories.map(({ id }) => id).indexOf(id)
        }
        else if (ruleMatch) {
            // This line contains a rule
            const id = ruleMatch[1]
            const rule = ruleMatch[2]
            const subrules: Array<Subrule> = []
            rulesArr[lastCategoryIndex].subcategories[lastSubcategoryIndex].rules.push({ id, rule, subrules })

            lastRuleIndex = rulesArr[lastCategoryIndex].subcategories[lastSubcategoryIndex].rules.map(({ id }) => id).indexOf(id)
        }
        else if (subruleMatch) {
            // This line contains a subrule
            const id = subruleMatch[1]
            const rule = subruleMatch[2]
            rulesArr[lastCategoryIndex].subcategories[lastSubcategoryIndex].rules[lastRuleIndex].subrules.push({ id, rule })
        }
    })

    return rulesArr
}

/** 
 * Parses an array of strings that contains the mtg glossary
 * @param {string[]} lines The raw lines of the glossary
 * @returns {GlossaryTerm[]} The parsed glossary object
 */
function parseGlossary(lines: string[]): GlossaryTerm[] {
    let termsArr: Array<GlossaryTerm> = []
    let lastTermIndex = 0
    lines.forEach((line) => {
        const cleanLine = line.trim()
        if (!cleanLine) { return }

        if (!cleanLine.endsWith(".") && !cleanLine.endsWith("”") && !cleanLine.includes("See rule")) {
            termsArr.push({
                "term": cleanLine,
                meanings: []
            })

            lastTermIndex = termsArr.findIndex(({ term }) => term === cleanLine)
        } else {
            termsArr[lastTermIndex].meanings.push(cleanLine)
        }
    })

    return termsArr
}

/**
 * Get the date the rules went into effect as an epoch timestamp
 * @param rulesText The raw rules text
 * @returns An epoch timestamp
 */
function getEffectiveDate(rulesText: String): number | undefined {
    const regex = new RegExp('These rules are effective as of (.+)\.')
    const dateLine = rulesText.split("\r")[2]
    const matches = dateLine.match(regex)

    if (matches) {
        console.log(matches)
        return Date.parse(matches[1])
    } else {
        console.log("No matches")
    }
}