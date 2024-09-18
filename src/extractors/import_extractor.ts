import Model from "../model/index.js"
import string from '@adonisjs/core/helpers/string'

class ModelImport {
  declare name: string
  declare namespace: string

  isDefault = false
  isType = false

  constructor(name: string, namespace: string, isDefault: boolean | null = null, isType: boolean | null = null) {
    this.name = name
    this.namespace = namespace
    this.isDefault = isDefault ?? this.isDefault
    this.isType = isType ?? this.isType
  }

  /**
   * converts model imports into import strings, grouped by import path
   * @param imports
   * @returns 
   */
  static getStatements(imports: ModelImport[]) {
    const groups = this.#getNamespaceGroups(imports)

    return Object.values(groups).map((items) => {
      const defaultImport = items.find((item) => item.isDefault)?.name
      const namedImports = items
        .filter((item) => !item.isDefault)
        .map((item) => item.name)
        .join(', ')

      const names = [defaultImport, namedImports && `{ ${namedImports} }`]
        .filter(Boolean)
        .join(', ')

      return `import${items[0].isType ? ' type' : ''} ${names} from '${items[0].namespace}'`
    })
  }

  /**
   * group imports by their path
   * @param imports
   * @returns 
   */
  static #getNamespaceGroups(imports: ModelImport[]) {
    return imports.reduce<Record<string, ModelImport[]>>((groups, imp) => {
      const group = groups[imp.namespace] || []

      group.push(imp)

      groups[imp.namespace] = group

      return groups
    }, {})
  }
}

export default class ModelImportManager {
  #imports = new Map<string, ModelImport>()

  /**
   * add or update a model import to the #imports map
   * @param value
   */
  add(value: ModelImport) {
    const name = this.#getName(value)
    const existing = this.#imports.get(name)

    if (existing && existing.isType && !value.isType) {
      existing.isType = false
    }

    this.#imports.set(name, existing ?? value)
  }

  /**
   * get name for the import name unique to its namespace path
   * @param value
   * @returns
   */
  #getName(value: ModelImport) {
    return `${value.name}@${value.namespace}`
  }

  /**
   * extract import statements from provided model
   * @param model 
   * @returns 
   */
  extract(model: Model) {
    this.add(new ModelImport('BaseModel', '@adonisjs/lucid/orm'))
    this.add(new ModelImport('column', '@adonisjs/lucid/orm'))

    model.columns.map((column) => {
      if (column.type === 'DateTime') {
        this.add(new ModelImport('DateTime', 'luxon'))
      }
    })

    model.relationships.map((definition) => {
      if (definition.relatedModelName !== model.name) {
        this.add(new ModelImport(definition.relatedModelName, `./${string.snakeCase(definition.relatedModelName)}.js`, true))
      }

      this.add(new ModelImport(definition.type, '@adonisjs/lucid/orm'))
      this.add(new ModelImport(string.pascalCase(definition.type), '@adonisjs/lucid/types/relations', false, true))
    })

    return ModelImport.getStatements([...this.#imports.values()])
  }
}
