import { useState, useEffect } from 'react'
import { hc } from 'hono/client'
import { AppType } from '@lin-fan/api'

// Initialize Hono client
const client = hc<AppType>('/')

function App() {
    const [data, setData] = useState<string>('')

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await client.index.$get()
                const json = await res.json()
                setData(json.message)
            } catch (e) {
                console.error('Failed to fetch', e)
                setData('Failed to connect to API')
            }
        }
        fetchData()
    }, [])

    return (
        <div className="flex h-screen items-center justify-center bg-background text-foreground">
            <div className="text-center p-8 border rounded-lg shadow-lg">
                <h1 className="text-4xl font-bold mb-4">Family Asset Management</h1>
                <p className="text-xl text-muted-foreground">API Status: {data || 'Loading...'}</p>
            </div>
        </div>
    )
}

export default App
