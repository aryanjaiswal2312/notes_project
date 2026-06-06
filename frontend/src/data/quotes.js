export const quotes = [
  "Small steps become strong habits.",
  "Study with focus, rest with intention.",
  "A clear note today saves an hour tomorrow.",
  "Progress counts, even when it is quiet.",
  "Build the routine and the results will follow.",
  "Curiosity turns practice into momentum."
];

export function randomQuote() {
  return quotes[Math.floor(Math.random() * quotes.length)];
}
