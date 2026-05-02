import Tea from '../../notdriver/assets/icons/tea.svg'
import Snack from '../../notdriver/assets/icons/snack.svg'
import Lunch from '../../notdriver/assets/icons/lunch.svg'

export const breakData= [ 
  {
    id:1,
    name:'teaBreak',
    duration: '15 min',
    value: 15 * 60,
    icon: <Tea />
  },
  {
    id:2,
    name:'snack',
    duration: '30 min',
    icon: <Snack />,
    value: 30 * 60,
  },
  {
    id:3,
    name:'lunch',
    duration: '1 hr',
    icon: <Lunch />,
    value: 60 * 60,
  },

]