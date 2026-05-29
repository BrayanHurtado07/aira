package tipos

import "github.com/google/uuid"

func NuevoID() string {
	return uuid.New().String()
}
