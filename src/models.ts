export interface RulesObject {
    rules: Category[]
    glossary: GlossaryTerm[]
    effectiveDate: number // An epoch timestamp indicating the date the rules came into effect
}

export interface Category {
    id: string
    title: string
    subcategories: Subcategory[]
}

export interface Subcategory {
    id: string
    title: string
    rules: Rule[]
}

export interface Rule {
    id: string
    rule: string
    subrules: Subrule[]
}

export interface Subrule {
    id: string
    rule: string
}

export interface GlossaryTerm {
    term: string
    meanings: string[]
}