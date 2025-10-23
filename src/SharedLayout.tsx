// @ts-ignore
import {Outlet} from "react-router"
// @ts-ignore
import {Container, Form, Navbar} from "react-bootstrap";
import "bootstrap-icons/font/bootstrap-icons.css";
import {SearchBox} from "./components/SearchBox.tsx";
// @ts-ignore
import logo from './logo512.png';

function Logo() {
	return <img alt="logo" className="logo" src={logo}/>
}

export function updateDarkMode() {
	console.log("update");
	const body = document.getElementById('body');
	const icon = document.getElementById('darkModeToggleIcon');
	const button = document.getElementById('darkModeToggle');
	if (body === null || icon === null || button === null) {
		console.log('too early');
		return;
	}
	if (localStorage.getItem('isDarkMode') === 'true') {
		body.setAttribute('data-bs-theme', 'dark');
		icon.classList.remove('bi-sun');
		icon.classList.add('bi-moon');
		(button as any).checked = true;
	} else if (localStorage.getItem('isDarkMode') === 'false') {
		body.setAttribute('data-bs-theme', 'light');
		icon.classList.add('bi-sun');
		icon.classList.remove('bi-moon');
		(button as any).checked = false;
	}
}

function SharedLayout() {
	return <div className="sharedLayout align-items-center">
		<header>
			<Navbar expand="md" className="navbar">
				<Container className="fs-5 align-items-md-center">
					<Navbar.Brand href="/"><Logo/></Navbar.Brand>
					<Navbar.Toggle aria-controls="basic-navbar-nav"/>
					<Navbar.Collapse id="basic-navbar-nav">
						<SearchBox/>
						<Form className='dark-mode-switcher'>
							<Form.Check
								type="switch"
								id="darkModeToggle"
								label={<i className='bi bi-moon' id='darkModeToggleIcon'></i>}
								onChange={() => {
									const body = document.getElementById('body');
									if (body === null) {
										return;
									} else if (body.getAttribute('data-bs-theme') === 'dark') {
										localStorage.setItem('isDarkMode', 'false');
									} else {
										body.setAttribute('data-bs-theme', 'dark')
										localStorage.setItem('isDarkMode', 'true');
									}
									updateDarkMode();
								}}
								defaultChecked={localStorage.getItem('isDarkMode') !== 'false'}
							/>
						</Form>
					</Navbar.Collapse>
				</Container>
			</Navbar>
		</header>
		<main>
			<article className="fs-6">
				<Container>
					<Outlet/>
				</Container>
			</article>
		</main>
		<footer>
			<Container className="justify-content-center fs-6">
				<div className="col">
					<p>This is a fan-made wiki for <a href="https://endless-sky.github.io/">Endless Sky</a>. To
						contribute, please visit TODO.</p>
				</div>
			</Container>
		</footer>
	</div>;
}

export default SharedLayout;