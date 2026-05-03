import { NotFoundPage } from '@payloadcms/next/views'
import config from '@payload-config'
import { importMap } from '../importMap'

type NotFoundArgs = {
  params: Promise<{ segments: string[] }>
  searchParams: Promise<{ [key: string]: string | string[] }>
}

const NotFound = (args: NotFoundArgs): Promise<JSX.Element> =>
  NotFoundPage({ config, importMap, params: args.params, searchParams: args.searchParams })

export default NotFound
