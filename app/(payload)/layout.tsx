import React from 'react'

const PayloadLayout = ({ children }: { children: React.ReactNode }): JSX.Element => (
  <html lang="en">
    <body>{children}</body>
  </html>
)

export default PayloadLayout
