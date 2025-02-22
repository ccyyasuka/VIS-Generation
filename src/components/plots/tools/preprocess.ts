export default function preprocessData(
  data: any[],
  x: string,
  y: string,
  groupBy: string | null,
  z?: string
) {
  console.log('item0205', data, x, y)

  return data.map((item) => {
    if (groupBy && item.hasOwnProperty(groupBy)) {
      // If 'z' exists, include it in the result
      if (z && item.hasOwnProperty(z)) {
        return {
          label: item[x],
          value: item[y] as number,
          z: item[z] as number,
          groupBy: item[groupBy] as string,
        }
      } else {
        return {
          label: item[x],
          value: item[y] as number,
          groupBy: item[groupBy] as string,
        }
      }
    } else {
      // If 'z' exists, include it in the result
      if (z && item.hasOwnProperty(z)) {
        return {
          label: item[x],
          value: item[y] as number,
          z: item[z] as number,
          groupBy: null,
        }
      } else {
        return {
          label: item[x],
          value: item[y] as number,
          groupBy: null,
        }
      }
    }
  })
}
