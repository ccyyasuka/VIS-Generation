export default function calculateMargin(
  legendPos: string | undefined,
  legendOrientation: string | undefined
) {
  if (legendOrientation === 'Horizontal') {
    if (legendPos === 'top-left') {
      return { top: 40, right: 20, bottom: 40, left: 60 }
    }
    if (legendPos === 'top-right') {
      return { top: 40, right: 20, bottom: 40, left: 60 }
    }
    if (legendPos === 'bottom-left') {
      return { top: 20, right: 20, bottom: 60, left: 60 }
    }
    if (legendPos === 'bottom-left') {
      return { top: 20, right: 20, bottom: 60, left: 60 }
    }
    return { top: 30, right: 20, bottom: 40, left: 60 }
  }
  if (legendOrientation === 'vertical') {
    if (legendPos === 'top-left') {
      return { top: 30, right: 20, bottom: 40, left: 140 }
    }
    if (legendPos === 'top-right') {
      return { top: 30, right: 80, bottom: 40, left: 60 }
    }
    if (legendPos === 'bottom-left') {
      return { top: 30, right: 20, bottom: 40, left: 140 }
    }
    if (legendPos === 'bottom-right') {
      return { top: 30, right: 80, bottom: 40, left: 60 }
    }
    return { top: 30, right: 20, bottom: 40, left: 60 }
  }
  return { top: 30, right: 80, bottom: 40, left: 60 }
}
