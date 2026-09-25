import { render } from 'preact'
import { Shell } from './ui/shell'
import './ui/styles.css'

const app = document.getElementById('app')
if (!app) throw new Error('Client-Mountpunkt #app fehlt')

render(<Shell />, app)
