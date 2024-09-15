import { generators } from '@adonisjs/core/app'
import ModelColumn from './column.js'
import { TableSchema } from '../db/schema.js'
import ModelRelationship from './relationship.js'

export default class Model {
  declare name: string
  declare tableName: string
  declare columns: ModelColumn[]
  declare relationships: ModelRelationship[]

  isPivotTable: boolean = false

  constructor(name: string, columns: ModelColumn[]) {
    this.name = generators.modelName(name)
    this.tableName = name
    this.columns = columns
  }

  setPivotTable(isPivotTable: boolean) {
    this.isPivotTable = isPivotTable
  }

  static build(tables: TableSchema[]) {
    const models = this.#getModelsFromTables(tables)
    const relationships = ModelRelationship.parse(models)

    for (let model of models) {
      const ships = relationships.get(model.name)
      model.relationships = [...(ships?.values() || [])]
    }

    return models
  }

  static #getModelsFromTables(tables: TableSchema[]) {
    return tables.map((table) => {
      const columns = table.columns.map((column) => new ModelColumn(column))
      return new Model(table.name, columns)
    })
  }
}
