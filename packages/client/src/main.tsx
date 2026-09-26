import { render } from 'preact'
import { Shell } from './ui/shell'
import './ui/styles/index.css'

const root = document.getElementById('app')
if (!root) throw new Error('Mountpunkt #app fehlt in index.html')

render(<Shell />, root)
