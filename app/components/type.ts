export interface ItemTransaction {
  weight: number
  price: number
  totalPrice: number
  time: string
  profit?: number
  fee?: number
}

export interface Transaction {
  buy: ItemTransaction
  sell?: ItemTransaction
}
