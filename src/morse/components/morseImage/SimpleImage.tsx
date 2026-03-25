import { useMorse } from '../../context/MorseContext'

interface SimpleImageProps {
  icon: string
  height: number
  width: number
}

export function SimpleImage({ icon, height, width }: SimpleImageProps) {
  const { morseLoadImages } = useMorse()
  const src = morseLoadImages?.getSrc(icon) ?? ''
  return <img src={src} height={height} width={width} style={{ verticalAlign: 'middle' }} alt="" />
}
