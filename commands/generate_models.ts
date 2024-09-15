import { inject } from '@adonisjs/core'
import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import Schema from '../src/db/schema.js'
import Model from '../src/model/index.js'

export default class GenerateModels extends BaseCommand {
  static commandName = 'generate:models'
  static description = 'Generate model files from an existing database'

  static options: CommandOptions = {
    startApp: true,
  }

  @inject()
  async run(schema: Schema) {
    const tables = await schema.getTables()
    const models = Model.build(tables)

    console.log({ models })
  }
}
