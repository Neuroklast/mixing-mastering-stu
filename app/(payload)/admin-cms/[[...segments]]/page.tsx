import type { Metadata } from 'next'
import { RootPage, generatePageMetadata } from '@payloadcms/next/views'
import config from '@payload-config'
import { importMap } from '../importMap'

type PageArgs = {
  params: Promise<{ segments: string[] }>
  searchParams: Promise<{ [key: string]: string | string[] }>
}

export const generateMetadata = async (args: PageArgs): Promise<Metadata> =>
  generatePageMetadata({ config, params: args.params, searchParams: args.searchParams })

const AdminPage = async (args: PageArgs): Promise<JSX.Element> =>
  RootPage({ config, params: args.params, searchParams: args.searchParams, importMap })

export default AdminPage
