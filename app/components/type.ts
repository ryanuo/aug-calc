export interface ItemTransaction {
  weight: number
  price: number
  totalPrice: number
  time: string
  profit?: number
  fee?: number
}

export interface Transaction {
  id: string
  buy: ItemTransaction
  sell?: ItemTransaction
}
