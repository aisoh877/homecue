export const initialTasks = [
 { id: 'table', title: 'Clear the dinner table', minutes: 3, owner: 'anyone', area: 'kitchen', status: 'open', priority: 3, description: 'clear plates table dinner kitchen tidy dishes' },
 { id: 'lunch', title: 'Pack tomorrow’s lunch', minutes: 6, owner: 'you', area: 'kitchen', status: 'open', priority: 2, description: 'prepare pack lunch lunchbox tomorrow kitchen food' },
 { id: 'towels', title: 'Fold the clean towels', minutes: 5, owner: 'anyone', area: 'living', status: 'open', priority: 1, description: 'fold clean laundry towels basket fabric living room' },
 { id: 'recycling', title: 'Sort the recycling', minutes: 4, owner: 'you', area: 'kitchen', status: 'open', priority: 2, description: 'sort recycling paper cardboard bottles kitchen bin' },
 { id: 'books', title: 'Put away the picture books', minutes: 3, owner: 'Jamie', area: 'living', status: 'open', priority: 1, description: 'put away books bookshelf reading picture books living room' },
 { id: 'entry', title: 'Reset the entryway', minutes: 4, owner: 'anyone', area: 'entry', status: 'open', priority: 2, description: 'shoes coat bags tidy entry hall hallway doorway' }
];
export const intentExamples = {
 plan: ['Plan a ten minute reset around the house', 'I have a few minutes what can I do in the kitchen', 'Help me make a short plan of chores', 'What should I do next with five minutes'],
 complete: ['Mark a task as done', 'I finished clearing the table', 'The towels are folded now', 'Check off the recycling task'],
 handoff: ['What is left for me to do', 'Give me the household handoff', 'What has Jamie already done', 'Catch me up on the chores'],
 undo: ['Undo the last change', 'That was a mistake put the task back', 'Restore the task I just completed'],
 unsupported: ['Buy groceries and pay for them', 'Send a message to Jamie', 'Unlock the front door', 'Turn on the oven', 'What is the weather outside', 'Play some music']
};
