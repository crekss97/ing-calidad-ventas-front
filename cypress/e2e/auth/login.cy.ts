describe('Login - E2E', () => {

    beforeEach(() => {
        cy.visit('/auth/login');
    })

    context('Interfaz de Usuario', () => {
        it('debe mostrar los elementos del formulario del login', () => {
            cy.get('input[type="email"]').should('be.visible');
            cy.get('input[type="password"]').should('be.visible');
            cy.get('button[type="submit"]').should('be.visible');
            cy.contains('Iniciar sesión').should('be.visible');
            cy.contains('¿No tienes una cuenta? Regístrate aquí').should('be.visible');
        })
    })
    context('Validación de Formulario', () => {
        
        it('debe mostrar errores cuando campos están vacíos', () => {
            cy.get('button[type="submit"]').click();

            cy.contains('El email es obligatorio').should('be.visible');
            cy.contains('La contraseña es obligatoria').should('be.visible');
        })
    })

        it('debe mostrar error con email inválido', () => {
            cy.get('input[type="email"]').type('email@invalido');
            cy.get('input[type="password"]').type('Password123');
            cy.get('button[type="submit"]').click();

            cy.contains('Email inválido').should('be.visible');
        })

        it('debe mostrar/ocultar contraseña al hacer clic en el icono', () => {
            cy.get('input[type="password"]').type('MiPassword123');
            cy.get('input[type="password"]').should('have.attr', 'type', 'password');
            cy.get('button i.bi-eye').click();
            cy.get('input[type="text"]').should('have.value', 'MiPassword123');
        })

    context('Navegación', () => {

        it('debe navegar a registro al hacer clic en "Registrate aquí"', () => {
            cy.contains('Regístrate aquí').click();
            cy.url().should('include', '/auth/register');
        })
        
        // it('debe navegar a recuperación de contraseña', () => {
        //     cy.contains('¿Olvidaste tu contraseña?').click();
        //     cy.url().should('include', '/auth/forgot-password');
        // })

    })    
})