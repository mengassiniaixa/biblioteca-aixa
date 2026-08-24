interface HelloProps {
  name: string;
}

export function Hello({ name }: HelloProps) {
  return <h1>Hola, {name}</h1>;
}
