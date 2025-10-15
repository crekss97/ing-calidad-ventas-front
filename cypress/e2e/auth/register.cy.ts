import { EmailValidator } from "@angular/forms";

describe('Regiser - E2E', () => {

    beforeEach(() => {
        cy.visit('/auth/register');
    })

    context('Flujo Completo de Registro', () => {

        it('debe completar registro exitosamente', () => {

            cy.intercept('POST', '**/api/auth/register', {
                statusCode: 201,
                body: {
                    user: {
                        id: '123',
                        fullName: 'Nuevo Usuario',
                        email: 'nuevo@ejemplo.com',
                        role: 'ADMIN',
                        isActive: true,
                        EmailVerified: false
                    },
                    token: 'new-user-token',
                    message: 'Usuario registrado exitosamente'
                },
            }).as('registerRequest');

            cy.get('input[id="fullName"]').should('be.visible').type('Nuevo Usuario').should('have.value', 'Nuevo Usuario');
            cy.get('input[id="email"]').type('nuevo@empresa.com').should('have.value', 'nuevo@empresa.com');
            cy.get('input[id="company"]').type('Mi Empresa S.A.').should('have.value', 'Mi Empresa S.A.');
            cy.get('input[id="password"]').type('Password123!').should('have.attr', 'type', 'password');

            cy.contains('Fuerte').should('be.visible');
            cy.get('.progress-bar').should('have.class', 'bg-success');

            cy.get('input[id="confirmPassword"]').type("Password123!").should('have.attr', 'type', 'password');
            
            cy.get('input[id="acceptTerms"]').check().should('be.checked');

            cy.get('button[type="submit"]').should('contain', 'Crear cuenta').click();

            cy.contains('Creando cuenta...').should('be.visible');

            //cy.wait('@registerRequest').its('response.statusCode').should('eq', 201);

            cy.url().should('include', '/dashboard');

            cy.window().then((win) => {
                const token = win.localStorage.getItem('salesapp_token');
                const user = JSON.parse(win.localStorage.getItem('salesapp_user') || '{}');

                expect(token).to.equal('fake-jwt-token');
                expect(user.email).to.equal('nuevo@empresa.com');
            });

        });
    });
    
    context('Validaciones de Contraseña', () => {

        it('debe validar fortaleza de contraseña en tiempo real', () => {
            const passwordInput = cy.get('input[id="password"]');

            passwordInput.type('abc');
            cy.contains('Débil').should('be.visible');
            cy.get('.progress-bar').should('have.class', 'bg-danger');

            passwordInput.clear().type('Abc123!');
            cy.contains('Media').should('be.visible');
            cy.get('.progress-bar').should('have.class', 'bg-warning');

            passwordInput.clear().type('Abc123!@#');
            cy.contains('Fuerte').should('be.visible');
            cy.get('.progress-bar').should('have.class', 'bg-success'); 
        })

        it('debe validar coincidencia de contraseñas', () => {
            cy.get('input[id="password"]').type('Password123!');
            cy.get('input[id="confirmPassword"]').type('Password543!');
            cy.get('button[type="submit"]').click();

            cy.contains('Las contraseñas no coinciden').should('be.visible');
        })
    })

    context('Nagevación', () => {

        it('debe redirigir a login si ya está autenticado', () => {
            cy.window().then((win) => {
                win.localStorage.setItem('salesapp_token', 'existing-token');
                win.localStorage.setItem('salesapp_user', JSON.stringify({
                    id: '1',
                    fullName: 'Usuario Existente',
                    email: 'existente@empresa.com'
                }));
            });

            cy.visit('/auth/register');

            cy.url().should('include', '/dashboard');
        })
    })


})