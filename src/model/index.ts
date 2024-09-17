import { generators } from '@adonisjs/core/app'
import ModelColumn from './column.js'
import { TableSchema } from '../db/schema.js'
import ModelRelationship, { ModelRelationshipDefinition } from './relationship.js'
import ModelImportManager from '../extractors/import_extractor.js'

export default class Model {
  declare name: string
  declare fileName: string
  declare tableName: string
  declare columns: ModelColumn[]
  declare relationships: ModelRelationshipDefinition[]
  declare imports: string[]

  isPivotTable: boolean = false

  constructor(name: string, columns: ModelColumn[]) {
    this.name = generators.modelName(name)
    this.fileName = generators.modelFileName(name)
    this.tableName = name
    this.columns = columns
  }

  static build(tables: TableSchema[]) {
    const models = this.#getModelsFromTables(tables)
    const relationships = ModelRelationship.parse(models)

    for (let model of models) {
      const ships = relationships.get(model.name)
      const values = [...(ships?.values() || [])]
      const importManager = new ModelImportManager()

      model.isPivotTable = values.filter((relation) => relation.isManyToMany)?.length >= 2
      model.relationships = values.reduce<ModelRelationshipDefinition[]>(
        (relationships, relationship) => {
          return [...relationships, ...relationship.getDefinitions(model.name)]
        },
        []
      )

      model.imports = importManager.extract(model)
    }

    return models.filter((model) => !model.isPivotTable)
  }

  static #getModelsFromTables(tables: TableSchema[]) {
    return tables.map((table) => {
      const columns = table.columns.map((column) => new ModelColumn(column))
      return new Model(table.name, columns)
    })
  }
}
