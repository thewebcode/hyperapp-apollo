import { h, Component, ActionsType } from "hyperapp"
import { ApolloQueryResult, ObservableQuery, ApolloClient } from "apollo-client"
import { isEqual } from "apollo-utilities"

import * as apollo from "./apollo"
import addLifeCycleHandlers from "./util/addLifeCycleHandlers"
import setData from "./util/setData"
import omit from "./util/omit"
import { QueryAttributes } from "./types"

export interface QueryModuleState {
  result: ApolloQueryResult<any> | null
  observable: ObservableQuery<any> | null
  subscription: {
    unsubscribe: () => void
  }
}

export interface State {
  modules: {
    [id: string]: QueryModuleState
  }
}

export interface Actions {
  init: (
    data: {
      id: string
      query: any
      variables?: any
      client: ApolloClient<any>
    }
  ) => void
  update: (data: { id: string; variables: any; oldVariables: any }) => void
  destroy: (data: { id: string }) => void
  refetch: (data: { id: string; variables?: any }) => void
  modules: {
    setData: (data: { id: string; data: Partial<QueryModuleState> }) => void
  }
}

export const state: State = {
  modules: {}
}

export const actions: ActionsType<State, Actions> = {
  init: ({
    id,
    query,
    variables,
    client
  }: {
    id: string
    query: any
    variables?: any
    client: ApolloClient<any>
  }) => (_, actions) => {
    const observable = client.watchQuery({ query, variables })
    const subscription = observable.subscribe(result =>
      actions.modules.setData({ id, data: { result } })
    )
    actions.modules.setData({ id, data: { observable, subscription } })
  },
  update: ({ id, variables, oldVariables }) => ({ modules }) => {
    if (!isEqual(variables, oldVariables)) {
      modules[id].observable!.setVariables(variables)
    }
  },
  destroy: ({ id }) => ({ modules }) => {
    modules[id].subscription.unsubscribe()
    return {
      modules: omit(modules, id)
    }
  },
  refetch: ({ id, variables }: { id: string; variables?: any }) => ({
    modules
  }) => {
    modules[id].observable!.refetch(variables)
  },
  modules: {
    setData
  }
}

let counter = 0

function getRenderProps<Data, Variables>(
  state: QueryModuleState | undefined,
  actions: Actions,
  id: string
): QueryAttributes<Data, Variables> {
  const observable = state && state.observable
  const result = state && state.result
  return {
    variables: observable && (observable.variables as any),
    data:
      result && Object.keys(result.data).length ? (result.data as Data) : null,
    errors: result && result.errors,
    loading: result ? result.loading : true,
    refetch: () => actions.refetch({ id })
  }
}

function renderComponent<Data, Variables>(state: State, actions: Actions, id: string, render: Component<any, any, any>) {
  return h(
    render,
    getRenderProps<Data, Variables>(
      state.modules[id],
      actions,
      id
    )
  )
}

export default function query<Data = {}, Variables = {}>(
  query: any
): Component<
  {
    key?: string
    variables?: Variables
    render: Component<QueryAttributes<Data, Variables>, any, any>
  },
  { apollo: apollo.State },
  { apollo: apollo.Actions }
> {
  const tmp = `q${counter++}`
  return ({ variables, render, key }) => (
    { apollo: state },
    { apollo: actions }
  ) => {
    const id = key ? `${tmp}[${key}]` : tmp
    const vnode = renderComponent<Data, Variables>(state.query, actions.query, id, render)
    vnode.attributes = addLifeCycleHandlers(
      {
        ...vnode.attributes,
        key: id
      },
      {
        oncreate: () => actions.initQuery({ id, query, variables }),
        onupdate: (_, old) =>
          actions.query.update({ id, variables, oldVariables: old.variables }),
        ondestroy: () => actions.query.destroy({ id })
      }
    )
    return vnode
  }
}
