import { Container, CssBaseline } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Content from './Content';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});
function App() {
  return <ThemeProvider theme={darkTheme}>
    <CssBaseline>
      <Container sx={{ my: 2 }}>
        <Content />
      </Container>
    </CssBaseline>
  </ThemeProvider>;
}

export default App;
