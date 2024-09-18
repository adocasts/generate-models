import { generators } from '@adonisjs/core/app'
import ModelColumn from './column.js'
import { TableSchema } from '../db/schema.js'
import ModelImportManager from '../extractors/import_extractor.js'
import ModelRelationshipManager, {
  ModelRelationship,
} from '../extractors/relationship_extractor.js'

export default class Model {
  declare name: string
  declare fileName: string
  declare tableName: string
  declare columns: ModelColumn[]
  declare relationships: ModelRelationship[]
  declare imports: string[]

  isPivotTable: boolean = false

  constructor(name: string, columns: ModelColumn[]) {
    this.name = generators.modelName(name)
    this.fileName = generators.modelFileName(name)
    this.tableName = name
    this.columns = columns
  }

  /**
   * build the model definitions from the tables
   * @param tables
   * @returns
   */
  static build(tables: TableSchema[]) {
    const models = this.#getModelsFromTables(tables)
    const relationshipManager = new ModelRelationshipManager(models)
    const relationships = relationshipManager.extract()

    for (let model of models) {
      const importManager = new ModelImportManager()

      model.relationships = relationships.filter((relation) => relation.modelName === model.name)
      model.imports = importManager.extract(model)
    }

    return models.filter((model) => !model.isPivotTable)
  }

  /**
   * convert tables into model definitions
   * @param tables
   * @returns
   */
  static #getModelsFromTables(tables: TableSchema[]) {
    return tables.map((table) => {
      const columns = table.columns.map((column) => new ModelColumn(column))
      return new Model(table.name, columns)
    })
  }
}
